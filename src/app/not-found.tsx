import Providers from "./providers";
import NotFound from "./(store)/not-found";

export default function RootNotFound() {
  return (
    <Providers>
      <NotFound />
    </Providers>
  );
}
