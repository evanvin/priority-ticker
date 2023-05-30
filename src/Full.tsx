import App from './App';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';

function Full(props: any) {
  const handle = useFullScreenHandle();

  return (
    <FullScreen handle={handle}>
      <App fullScreenHandle={handle}></App>
    </FullScreen>
  );
}

export default Full;
