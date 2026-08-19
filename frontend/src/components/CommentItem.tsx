interface CommentItemProps {
  id: number;
  sender: string;
  text: string;
  onReply: (id: number) => void;
  onReport: (id: number) => void;
}

function CommentItem({ id, sender, text, onReply, onReport }: CommentItemProps) {
  return (
    <div className="relative rounded-lg bg-gray-50 border border-gray-200 p-4 shadow-sm flex justify-between items-start">
      <div>
        <p className="font-semibold text-blue-700">{sender}</p>
        <p className="text-gray-800 whitespace-pre-line">{text}</p>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <button className="text-sm text-blue-600 hover:underline" onClick={() => onReply(id)}>پاسخ</button>
        <button className="text-sm text-red-500 hover:underline" onClick={() => onReport(id)}>گزارش</button>
      </div>
    </div>
  );
}

export default CommentItem;