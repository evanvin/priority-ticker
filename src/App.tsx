import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

/* <p className="App-logo">https://codepen.io/chris22smith/pen/YZPrjr</p> */

const reorder = (
  list: Array<any>,
  startIndex: number,
  endIndex: number
): Array<any> => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const getItems = (count: number): Array<any> =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${k}`,
    content: `item ${k}`,
  }));

type MyProps = {};
type MyState = {
  items: any[];
};

class App extends React.Component<MyProps, MyState> {
  state: MyState = { items: getItems(30) };

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

    this.setState({
      items,
    });
  };

  render() {
    return (
      <div className='container'>
        <div className='add-to'>test</div>
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
                        {item.content}
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
