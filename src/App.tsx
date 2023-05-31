import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import fullEnterIcon from './full_enter.svg';
import fullExitIcon from './full_exit.svg';
import settingsIcon from './settings.svg';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  DragDropContext,
  Droppable,
  Draggable,
  ResponderProvided,
  DragStart,
} from 'react-beautiful-dnd';
import { JsonBinApi } from './jsonbin';
import classNames from 'classnames';

const jsonBinApiLS = 'priority-ticker-json-bin';

const reorder = (
  list: Array<Item>,
  startIndex: number,
  endIndex: number
): Array<Item> => {
  const result = Array.from(list);

  const [removed] = result.splice(startIndex, 1);
  removed['lastUpdated'] = new Date();

  let change = startIndex - endIndex;
  if (
    (change < 0 && (removed['changeAmount'] || 0) < 0) ||
    (change > 0 && (removed['changeAmount'] || 0) > 0)
  ) {
    // we want to further decrease/increase
    removed['changeAmount'] += change;
  } else {
    removed['changeAmount'] = change;
  }

  result.splice(endIndex, 0, removed);

  if (startIndex < endIndex) {
    // increase all that were moved above the currently selected by one
    for (let i = startIndex; i < endIndex; i++) {
      result[i].changeAmount += 1;
    }
  } else {
    // decrease all that were moved below the currently select by one
    for (let i = endIndex + 1; i <= startIndex; i++) {
      result[i].changeAmount -= 1;
    }
  }

  return result;
};

const getArrow = (change: number) => {
  // ▲▼
  let arrow: string = '';
  let cls: string = '';

  if (change > 0) {
    arrow = '▲';
    cls = 'increase';
  } else if (change < 0) {
    arrow = '▼';
    cls = 'decrease';
  }

  return (
    <span className={`change ${cls}`}>
      {arrow} {change === 0 ? '-' : Math.abs(change)}
    </span>
  );
};

type Item = {
  id: string;
  name: string;
  changeAmount: number;
  lastUpdated?: Date;
  createdAt: Date;
};
type MyProps = {
  fullScreenHandle: any;
};
type MyState = {
  items: Item[];
  typedItem: string;
  isFullScreen: boolean;
  isDragging: boolean;
  jbApi: JsonBinApi;
  jbApiKey: string;
  jbBinId: string;
  isLoadingJsonBin: boolean;
  isConfigured: boolean;
  showSettings: boolean;
};

class App extends React.Component<MyProps, MyState> {
  state: MyState = {
    items: [],
    typedItem: '',
    isFullScreen: false,
    jbApi: new JsonBinApi('', ''),
    isLoadingJsonBin: true,
    isDragging: false,
    showSettings: false,
    isConfigured: false,
    jbApiKey: '',
    jbBinId: '',
  };

  onDragEnd = (result: any) => {
    console.log(result);
    // dropped outside the list
    if (!result.destination) {
      this.setState({
        isDragging: false,
      });
      return;
    }

    if (result.destination.droppableId === 'deletable') {
      this.delete(result.source.index);
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    this.state.jbApi.updateData(JSON.stringify(items));

    this.setState({
      items,
      isDragging: false,
    });
  };

  onDragStart = (start: DragStart, provided: ResponderProvided) => {
    this.setState({ isDragging: true });
  };

  handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.add();
    }
  };

  add = (): void => {
    const { items, typedItem, jbApi: jsonBinApi } = this.state;

    const item: Item = {
      id: uuidv4(),
      name: typedItem,
      createdAt: new Date(),
      changeAmount: 0,
    };

    items.push(item);

    jsonBinApi.updateData(JSON.stringify(items));

    this.setState({ items, typedItem: '' });
  };

  delete = (index: number): void => {
    const { items, jbApi: jsonBinApi } = this.state;

    items.splice(index, 1);

    jsonBinApi.updateData(JSON.stringify(items));

    this.setState({ items, isDragging: false });
  };

  changeFullScreen = (): void => {
    if (this.state.isFullScreen) {
      this.props.fullScreenHandle.exit();
    } else {
      this.props.fullScreenHandle.enter();
    }

    this.setState({ isFullScreen: !this.state.isFullScreen });
  };

  toggleSettings = () => {
    this.setState({ showSettings: !this.state.showSettings });
  };

  updateJB = () => {
    const { jbApiKey, jbBinId } = this.state;
    console.log(this.state);
    localStorage.setItem(
      jsonBinApiLS,
      JSON.stringify({
        key: jbApiKey,
        bin: jbBinId,
      })
    );

    this.setState({
      jbApi: new JsonBinApi(String(jbApiKey), String(jbBinId)),
    });
  };

  async componentDidMount() {
    let jsonBin: string | null = localStorage.getItem(jsonBinApiLS);

    if (jsonBin != null) {
      const ls = JSON.parse(jsonBin);
      const jsonBinApi = new JsonBinApi(ls['key'], ls['bin']);

      localStorage.setItem(
        jsonBinApiLS,
        JSON.stringify({
          key: ls['key'],
          bin: ls['bin'],
        })
      );

      try {
        const items = await jsonBinApi.readData();
        this.setState({
          jbApi: jsonBinApi,
          items: items['record'],
          isConfigured: true,
        });
      } catch (error: any) {
        console.log(error);
      }

      this.setState({
        jbApiKey: ls['key'],
        jbBinId: ls['bin'],
      });
    }

    this.setState({
      isLoadingJsonBin: false,
    });
  }

  render() {
    const { isFullScreen, isLoadingJsonBin } = this.state;

    return (
      <>
        <div className='container'>
          <div className='add-to'>
            <div className='input-group'>
              <input
                onKeyUp={(e) => {
                  this.handleKeyUp(e);
                }}
                value={this.state.typedItem}
                placeholder='Add Item'
                className='input-field'
                type='text'
                onChange={(e) => {
                  this.setState({ typedItem: e.target.value });
                }}
              />
              <button onClick={this.add}>ADD</button>
            </div>
            <div className='btn' onClick={this.changeFullScreen}>
              <img
                src={isFullScreen ? fullExitIcon : fullEnterIcon}
                alt='fullscreen-icon'
              />
            </div>
            <div className='btn' onClick={this.toggleSettings}>
              <img src={settingsIcon} alt='settings-icon' />
            </div>
          </div>
          {isLoadingJsonBin ? (
            <div className='loader'>
              <span />
            </div>
          ) : this.state.isConfigured ? (
            <DragDropContext
              onDragEnd={this.onDragEnd}
              onDragStart={this.onDragStart}
            >
              <Droppable droppableId='droppable'>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={classNames('list', {
                      'dragging-over': snapshot.isDraggingOver,
                    })}
                  >
                    {this.state.items.map((item: any, index: number) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={classNames('item', {
                              dragging: snapshot.isDragging,
                            })}
                            style={provided.draggableProps.style}
                          >
                            <div className='name'>{item.name}</div>
                            <div className='amount'>
                              {getArrow(item.changeAmount)}
                            </div>
                            <div
                              className='remove'
                              onClick={(e) => this.delete(index)}
                            >
                              x
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <Droppable droppableId='deletable'>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={classNames('delete', {
                      'dragging-over': snapshot.isDraggingOver,
                      show: this.state.isDragging,
                    })}
                  >
                    <div className='words'>{snapshot.isDraggingOver}</div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className='list'>
              <div className='item'>
                <div className='name'>Needs Configuration</div>
              </div>
            </div>
          )}
        </div>
        <div
          className={classNames('drawer', { closed: !this.state.showSettings })}
        >
          <div className='content'>
            <div className='input-group'>
              <input
                value={this.state.jbApiKey}
                placeholder='API Key'
                className='input-field'
                type='password'
                onChange={(e) => {
                  this.setState({ jbApiKey: e.target.value });
                }}
              />
              <button onClick={this.updateJB}>UPDATE</button>
            </div>
            <div className='input-group'>
              <input
                value={this.state.jbBinId}
                placeholder='Bin ID'
                className='input-field'
                type='text'
                onChange={(e) => {
                  this.setState({ jbBinId: e.target.value });
                }}
              />
              <button onClick={this.updateJB}>UPDATE</button>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default App;
