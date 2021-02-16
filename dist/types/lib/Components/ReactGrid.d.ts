import * as React from 'react';
import { ReactGridProps } from '../Model/PublicModel';
import { State } from '../Model/State';
export declare class ReactGrid extends React.Component<ReactGridProps, State> {
    private updateState;
    private stateUpdater;
    private pointerEventsController;
    private eventHandlers;
    private cellMatrixBuilder;
    state: State;
    static getDerivedStateFromProps(props: ReactGridProps, state: State): State | undefined;
    componentDidUpdate(prevProps: ReactGridProps, prevState: State): void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): React.ReactNode;
}
