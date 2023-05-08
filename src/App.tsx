import axios from 'axios';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/* <p className="App-logo">https://codepen.io/chris22smith/pen/YZPrjr</p> */

const itemsLocalStorageKey = 'priority-ticker-items';

const reorder = (
  list: Array<Item>,
  startIndex: number,
  endIndex: number
): Array<Item> => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  removed['lastUpdated'] = new Date();
  removed['changeAmount'] = '' + (startIndex - endIndex);

  result.splice(endIndex, 0, removed);

  return result;
};

type Item = {
  id: string;
  name: string;
  changeDirection?: string;
  changeAmount?: string;
  lastUpdated?: Date;
  createdAt: Date;
};
type MyProps = {};
type MyState = {
  items: Item[];
  typedItem: string;
  adhdMode: boolean;
};

class App extends React.Component<MyProps, MyState> {
  state: MyState = { items: [], typedItem: '', adhdMode: true };

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

    localStorage.setItem(itemsLocalStorageKey, JSON.stringify(items));

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
    };

    items.push(item);

    localStorage.setItem(itemsLocalStorageKey, JSON.stringify(items));

    this.setState({ items, typedItem: '' });
  };

  componentDidMount() {
    let ls: string | null = localStorage.getItem(itemsLocalStorageKey);

    let items = [];

    if (ls != null) {
      items = JSON.parse(ls);
    }

    this.setState({ items });
  }

  render() {
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
            <button>ADD</button>
            <button>ADHD MODE OFF</button>
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
                        } ${this.state.adhdMode ? 'adhd' : ''}`}
                        style={provided.draggableProps.style}
                      >
                        <div className='name'>{item.name}</div>
                        {this.state.adhdMode && (
                          <div className='amount'>
                            {item.changeDirection} {item.changeAmount}
                          </div>
                        )}
                        <div className='remove'>x</div>
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
