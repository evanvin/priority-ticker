import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import fullEnterIcon from './full_enter.svg';
import fullExitIcon from './full_exit.svg';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { JsonBinApi } from './jsonbin';

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
  jsonBinApi: JsonBinApi;
  jsonBinId: string;
};

class App extends React.Component<MyProps, MyState> {
  state: MyState = {
    jsonBinId: '',
    items: [],
    typedItem: '',
    isFullScreen: false,
    jsonBinApi: new JsonBinApi(''),
  };

  onDragEnd = (result: any) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    localStorage.setItem(jsonBinApiLS, JSON.stringify(items));

    this.setState({
      items,
    });
  };

  handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      this.add();
    }
  };

  add = (): void => {
    const { items, typedItem } = this.state;

    const item: Item = {
      id: uuidv4(),
      name: typedItem,
      createdAt: new Date(),
      changeAmount: 0,
    };

    items.push(item);

    localStorage.setItem(jsonBinApiLS, JSON.stringify(items));

    this.setState({ items, typedItem: '' });
  };

  delete = (index: number): void => {
    const { items } = this.state;

    items.splice(index, 1);

    localStorage.setItem(jsonBinApiLS, JSON.stringify(items));

    this.setState({ items });
  };

  changeFullScreen = () => {
    if (this.state.isFullScreen) {
      this.props.fullScreenHandle.exit();
    } else {
      this.props.fullScreenHandle.enter();
    }

    this.setState({ isFullScreen: !this.state.isFullScreen });
  };

  async componentDidMount() {
    let jsonBin: string | null = localStorage.getItem(jsonBinApiLS);

    let key: string | null = null;
    let bin: string | null = null;

    if (jsonBin == null) {
      key = window.prompt('Please enter your JSON Bin API Key');
      bin = window.prompt('Please enter your JSON Bin ID');
    } else {
      let ls = JSON.parse(jsonBin);

      key =
        ls['key'] == null
          ? window.prompt('Please enter your JSON Bin API Key')
          : ls['key'];
      bin =
        ls['bin'] == null
          ? window.prompt('Please enter your JSON Bin ID')
          : ls['bin'];
    }

    let jsonBinApi = new JsonBinApi(String(key));

    localStorage.setItem(
      jsonBinApiLS,
      JSON.stringify({
        key: String(key),
        bin: String(bin),
      })
    );

    const itms = await jsonBinApi.readData(String(bin));

    this.setState({
      jsonBinApi,
      jsonBinId: String(bin),
      items: itms['record']['items'],
    });
  }

  render() {
    const { isFullScreen } = this.state;

    return (
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
          <div className='full-screen-btn' onClick={this.changeFullScreen}>
            <img
              src={isFullScreen ? fullExitIcon : fullEnterIcon}
              className='full-icon'
              alt='fullscreen-icon'
            />
          </div>
        </div>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId='droppable'>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`list ${
                  snapshot.isDraggingOver ? 'dragging-over' : ''
                }`}
              >
                {this.state.items.map((item: any, index: number) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`item ${
                          snapshot.isDragging ? 'dragging' : ''
                        }`}
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
        </DragDropContext>
      </div>
    );
  }
}

export default App;
