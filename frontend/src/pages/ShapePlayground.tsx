
import { IdeaIcon } from "../assets/icons/IdeaIcon";




export default function ShapePlayground() {
  return (
    <div
      style={{
        width: 400,
        height: 400,
        background: "#f6f7fb",
        padding: 40,
      }}
    >
      <div
        style={{
          width: 200,
          height: 200,
          color: "#4F46E5", // testa currentColor
        }}
      >
        <IdeaIcon size={30} color="#F3F" />
      </div>
    </div>
  );
}
