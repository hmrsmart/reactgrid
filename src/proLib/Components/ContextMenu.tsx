import * as React from "react";
import { ProState } from "../Model/ProState";
import {
  MenuOption,
  isBrowserFirefox,
  i18n,
  isIOS,
  isIpadOS,
  getCompatibleCellAndTemplate,
  isMacOs,
  Compatible,
  Cell,
} from "../../core";
import { copySelectedRangeToClipboard } from "../Functions/copySelectedRangeToClipboard";
import { proPasteData } from "../Functions/proPasteData";
import { getProActiveSelectedRange } from "../Functions/getProActiveSelectedRange";
import { getSelectedLocations } from "../Functions/getSelectedLocations";

interface ContextMenuProps {
  state: ProState;
  onContextMenu?: (menuOptions: MenuOption[]) => MenuOption[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  onContextMenu,
  state,
}) => {
  const { contextMenuPosition, selectedIds, selectionMode } = state;
  let contextMenuOptions = customContextMenuOptions(state);
  const options = onContextMenu ? onContextMenu(contextMenuOptions) : [];
  if (options.length >= 0) contextMenuOptions = options;
  return (
    <div
      className="rg-context-menu"
      style={{
        top: contextMenuPosition.top + "px",
        left: contextMenuPosition.left + "px",
      }}
    >
      {contextMenuOptions.map(({ handler, id, label }, idx) => (
        <div
          key={idx}
          className="rg-context-menu-option"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            handler(
              selectionMode === "row" ? selectedIds : [],
              selectionMode === "column" ? selectedIds : [],
              selectionMode,
              getSelectedLocations(state)
            );
            state.update((state) => ({
              ...state,
              contextMenuPosition: { top: -1, left: -1 },
              ...((id === "copy" || id === "cut") && {
                copyRange: getProActiveSelectedRange(state as ProState),
              }),
            }));
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

function customContextMenuOptions(state: ProState): MenuOption[] {
  const { copyLabel, cutLabel, pasteLabel } = i18n(state);
  return [
    {
      id: "copy",
      label: copyLabel,
      handler: () => handleContextMenuCopy(state, false),
    },
    {
      id: "cut",
      label: cutLabel,
      handler: () => handleContextMenuCopy(state, true),
    },
    {
      id: "paste",
      label: pasteLabel,
      handler: () => handleContextMenuPaste(state),
    },
  ];
}

function handleContextMenuCopy(state: ProState, removeValues = false): void {
  copySelectedRangeToClipboard(state, removeValues);
}

function handleContextMenuPaste(state: ProState) {
  const isAppleMobileDevice = isIOS() || isIpadOS();
  if (isBrowserFirefox() || isAppleMobileDevice) {
    const {
      appleMobileDeviceContextMenuPasteAlert,
      otherBrowsersContextMenuPasteAlert,
      actionNotSupported,
    } = i18n(state);
    alert(
      `${actionNotSupported} ${
        isAppleMobileDevice
          ? appleMobileDeviceContextMenuPasteAlert
          : otherBrowsersContextMenuPasteAlert
      }`
    );
  } else {
    navigator.clipboard
      ?.readText()
      .then((e) =>
        state.update((state) => {
          const proState = state as ProState;
          const { copyRange } = proState;
          let applyMetaData = false;
          const clipboardRows = isMacOs() ? e.split("\n") : e.split("\r\n");
          const clipboard = clipboardRows.map((line) => line.split("\t"));
          if (copyRange && copyRange.rows && copyRange.columns) {
            const isSizeEqual =
              copyRange.rows.length === clipboardRows.length &&
              copyRange.columns.length === clipboard[0].length;
            if (isSizeEqual) {
              applyMetaData = copyRange.rows.some((row, rowIdx) => {
                return copyRange.columns.some((column, colIdx) => {
                  // need to avoid difference beetwen whitespace and space char
                  return (
                    clipboard[rowIdx][colIdx].trim() ===
                    getCompatibleCellAndTemplate(proState, { row, column })
                      .cell.text.replaceAll(
                        String.fromCharCode(160),
                        String.fromCharCode(32)
                      )
                      .trim()
                  );
                });
              });
            }
          }
          return proPasteData(
            proState,
            clipboardRows.map((line, rowIdx) => {
              return line.split("\t").map<Compatible<Cell>>((text, colIdx) => {
                if (!copyRange) {
                  return {
                    type: "text",
                    text,
                    value: parseFloat(text),
                  };
                }
                const { cell } = getCompatibleCellAndTemplate(proState, {
                  row: copyRange.rows[rowIdx],
                  column: copyRange.columns[colIdx],
                });
                return {
                  type: "text",
                  // probably this ternanary and spread operator is no longer needed
                  text: applyMetaData ? cell.text : text,
                  value: applyMetaData ? cell.value : parseFloat(text),
                  ...(applyMetaData && {
                    groupId: cell.groupId,
                  }),
                };
              });
            })
          );
        })
      )
      .catch(({ message }) => {
        console.error(
          `An error occurred while pasting data by context menu: '${message}'`
        );
      });
  }
}
