import type { CloudObjectModel } from "@/service/models";
import { VideoPlayer } from "../player/VideoPlayer";

/** Video preview — the premium custom player on the dark Zen stage. `onReload`
 *  (the modal's object refetch) feeds the mid-watch signed-URL recovery path. */
export function VideoViewer({
  object,
  onReload,
}: {
  object: CloudObjectModel;
  onReload?: () => void;
}) {
  return (
    <div className="zs-preview-stage relative flex h-full w-full">
      <VideoPlayer object={object} onReload={onReload} />
    </div>
  );
}
