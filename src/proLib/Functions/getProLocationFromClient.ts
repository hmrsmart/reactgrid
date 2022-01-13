import {
  GridColumn,
  GridRow,
  getScrollOfScrollableElement,
  getReactGridOffsets,
  getStickyOffset,
  Direction,
  PointerLocation,
  getVisibleSizeOfReactGrid,
  getSizeOfElement,
  getStickyTopRow,
  getLeftStickyColumn,
  getScrollableContentColumn,
  getScrollableContentRow,
} from "../../core";
import { ProState } from "../Model/ProState";

export function getProLocationFromClient(
  state: ProState,
  clientX: number,
  clientY: number,
  favorScrollableContent?: Direction
): PointerLocation {
  if (!state.reactGridElement) {
    throw new Error(
      `"state.reactGridElement" field should be initiated before calling the "getBoundingClientRect()"`
    );
  }
  const { left, top } = state.reactGridElement.getBoundingClientRect();
  const viewportX = clientX - left;
  const viewportY = clientY - top;

  const { cellY, row } = getRow(
    state,
    viewportY,
    favorScrollableContent === "vertical" || favorScrollableContent === "both"
  );
  const { cellX, column } = getColumn(
    state,
    viewportX,
    favorScrollableContent === "horizontal" || favorScrollableContent === "both"
  );
  return { row, column, viewportX, viewportY, cellX, cellY };
}

function getRow(
  state: ProState,
  viewportY: number,
  favorScrollableContent: boolean
): { cellY: number; row: GridRow } {
  return (
    getStickyTopRow(state, viewportY, favorScrollableContent) ||
    getStickyBottomRow(state, viewportY, favorScrollableContent) ||
    getRowOnNonSticky(state, viewportY)
  );
}

function getColumn(
  state: ProState,
  viewportX: number,
  favorScrollableContent: boolean
): { cellX: number; column: GridColumn } {
  return (
    getLeftStickyColumn(state, viewportX, favorScrollableContent) ||
    getRightStickyColumn(state, viewportX, favorScrollableContent) ||
    getColumnOnNonSticky(state, viewportX)
  );
}

function getRowOnNonSticky(
  state: ProState,
  viewportY: number
): { cellY: number; row: GridRow } {
  if (state.cellMatrix.scrollableRange.rows.length < 1) {
    const sticky =
      viewportY >= state.cellMatrix.height
        ? state.cellMatrix.last
        : state.cellMatrix.first;
    return {
      cellY: sticky.row.height,
      row: sticky.row,
    };
  }
  return getScrollableContentRow(state, viewportY);
}

function getColumnOnNonSticky(
  state: ProState,
  viewportX: number
): { cellX: number; column: GridColumn } {
  if (state.cellMatrix.scrollableRange.columns.length < 1) {
    const sticky =
      viewportX >= state.cellMatrix.width
        ? state.cellMatrix.last
        : state.cellMatrix.first;
    return {
      cellX: sticky.column.width,
      column: sticky.column,
    };
  }
  return getScrollableContentColumn(state, viewportX);
}

// PRO
function getStickyBottomRow(
  state: ProState,
  viewportY: number,
  favorScrollableContent: boolean
): { cellY: number; row: GridRow } | undefined {
  const cellMatrix = state.cellMatrix;
  const { scrollTop } = getScrollOfScrollableElement(state.scrollableElement);
  const { top } = getReactGridOffsets(state);
  const { height } = getSizeOfElement(state.scrollableElement);
  const topStickyOffset = getStickyOffset(scrollTop, top);
  const maxScrollTop = Math.max(cellMatrix.height - height + top, 0);
  const bottomStickyOffset =
    getVisibleSizeOfReactGrid(state).height +
    topStickyOffset -
    cellMatrix.ranges.stickyBottomRange.height;
  if (
    cellMatrix.ranges.stickyBottomRange.rows.length > 0 &&
    viewportY >= bottomStickyOffset &&
    !(favorScrollableContent && scrollTop + 1 < maxScrollTop)
  ) {
    const row =
      cellMatrix.ranges.stickyBottomRange.rows.find(
        (row) => row.bottom > viewportY - bottomStickyOffset
      ) || cellMatrix.last.row;
    const cellY = viewportY - bottomStickyOffset - row.top;
    return { cellY, row };
  }
}

export function getRightStickyColumn(
  state: ProState,
  viewportX: number,
  favorScrollableContent: boolean
): { cellX: number; column: GridColumn } | undefined {
  const cellMatrix = state.cellMatrix;
  const { scrollLeft } = getScrollOfScrollableElement(state.scrollableElement);
  const { left } = getReactGridOffsets(state);
  const { width } = getSizeOfElement(state.scrollableElement);
  const leftStickyOffset = getStickyOffset(scrollLeft, left);
  const maxScrollLeft = Math.max(cellMatrix.width - width + left, 0);
  const rightStickyOffset =
    getVisibleSizeOfReactGrid(state).width +
    leftStickyOffset -
    cellMatrix.ranges.stickyRightRange.width;
  if (
    cellMatrix.ranges.stickyRightRange.columns.length > 0 &&
    viewportX >= rightStickyOffset &&
    !(favorScrollableContent && scrollLeft + 1 < maxScrollLeft)
  ) {
    const column =
      cellMatrix.ranges.stickyRightRange.columns.find(
        (column) => column.right > viewportX - rightStickyOffset
      ) || cellMatrix.last.column;
    const cellX = viewportX - rightStickyOffset - column.left;
    return { cellX, column };
  }
}
