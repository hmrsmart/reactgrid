import { keyCodes } from './keyCodes';
export function handleKeyUp(event, state) {
    if (event.keyCode === keyCodes.TAB || event.keyCode === keyCodes.ENTER) {
        event.preventDefault();
        event.stopPropagation();
    }
    return state;
}
