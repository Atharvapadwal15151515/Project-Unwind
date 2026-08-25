import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState
} from "react";

import ConfirmDialog
  from "../components/common/ConfirmDialog";

const ConfirmDialogContext =
  createContext(null);

export function ConfirmDialogProvider({
  children
}) {
  const [
    dialog,
    setDialog
  ] = useState(null);

  const resolverRef =
    useRef(null);

  const confirm =
    useCallback(
      ({
        title = "Are you sure?",
        message = "",
        confirmText = "Confirm",
        cancelText = "Cancel",
        tone = "danger"
      } = {}) =>
        new Promise(
          (resolve) => {
            resolverRef.current =
              resolve;

            setDialog({
              title,
              message,
              confirmText,
              cancelText,
              tone
            });
          }
        ),
      []
    );

  const closeWithResult =
    useCallback(
      (result) => {
        resolverRef.current?.(
          result
        );

        resolverRef.current =
          null;

        setDialog(null);
      },
      []
    );

  return (
    <ConfirmDialogContext.Provider
      value={{ confirm }}
    >
      {children}

      <ConfirmDialog
        open={Boolean(dialog)}
        {...dialog}
        onConfirm={() =>
          closeWithResult(true)
        }
        onCancel={() =>
          closeWithResult(false)
        }
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context =
    useContext(
      ConfirmDialogContext
    );

  if (!context) {
    throw new Error(
      "useConfirm must be used inside ConfirmDialogProvider"
    );
  }

  return context.confirm;
}