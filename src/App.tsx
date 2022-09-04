import { useReducer } from "react";
import { P, match } from "ts-pattern";

import "./App.css";
import logo from "./logo.svg";

type ApiState =
  | { status: "idle" }
  | { status: "loading"; startTime: number }
  | { status: "success"; data: string }
  | { status: "error"; error: Error };

type ApiEvent =
  | { type: "fetch" }
  | { type: "success"; data: string }
  | { type: "error"; error: Error }
  | { type: "cancel" };

const reducer = (apiState: ApiState, apiEvent: ApiEvent): ApiState =>
  match<[ApiState, ApiEvent], ApiState>([apiState, apiEvent])
    .with([{ status: "loading" }, { type: "success" }], ([, event]) => ({
      status: "success",
      data: event.data,
    }))
    .with(
      [{ status: "loading" }, { type: "error", error: P.select() }],
      (error) => ({
        status: "error",
        error,
      })
    )
    .with([{ status: P.not("loading") }, { type: "fetch" }], () => ({
      status: "loading",
      startTime: Date.now(),
    }))
    .with(
      [
        {
          status: "loading",
          startTime: P.when((t) => t + 500 < Date.now()),
        },
        { type: "cancel" },
      ],
      () => ({
        status: "idle",
      })
    )
    .with(P._, () => apiState)
    .exhaustive();

const fakeFetchApi = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const now = Date.now();
    setTimeout(() => {
      if (now % 2 === 0) {
        resolve("Hello Ts Pattern");
      } else {
        reject("Oops! Something went wrong!");
      }
    }, 1000);
  });

function App() {
  const [state, dispatch] = useReducer(reducer, {
    status: "idle",
  });

  const onClickHandler = async () => {
    dispatch({ type: "fetch" });
    try {
      const data = await fakeFetchApi();
      dispatch({ type: "success", data });
    } catch (error) {
      dispatch({ type: "error", error: error as Error });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello Ts-Pattern + React!</p>
      </header>
      <main>
        {match(state)
          .with({ status: "loading" }, () => {
            return <p>Loading...</p>;
          })
          .with({ status: "error" }, (event) => {
            return (
              <p>
                Error
                <pre>{JSON.stringify(event, null, 2)}</pre>
              </p>
            );
          })
          .with({ status: "success" }, (event) => {
            return (
              <p>
                Success!
                <pre>{JSON.stringify(event, null, 2)}</pre>
              </p>
            );
          })
          .with({ status: "idle" }, () => {
            return <p>Press below button to start</p>;
          })
          .exhaustive()}
        <div className="buttons">
          <button onClick={onClickHandler}>Call Fetch Api</button>
          <button onClick={() => dispatch({ type: "cancel" })}>
            Cancel Api
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
