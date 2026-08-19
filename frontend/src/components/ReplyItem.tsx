interface ReplyItemProps {
  id: number;
  sender: string;
  text: string;
  onReply: (id: number) => void;
  onReport: (id: number) => void;
}

function ReplyItem({ id, sender, text, onReply, onReport }: ReplyItemProps) {
  return (
    <div className="relative ml-6 mt-4 border-l-4 border-blue-200 pl-4 bg-blue-50 rounded-lg flex justify-between items-start">
      <div>
        <p className="font-semibold text-blue-600">{sender}</p>
        <p className="text-gray-700 whitespace-pre-line">{text}</p>
      </div>
      <div className="flex flex-col items-end space-y-1 text-xs">
        <button className="text-blue-600 hover:underline" onClick={() => onReply(id)}>پاسخ</button>
        <button className="text-red-500 hover:underline" onClick={() => onReport(id)}>گزارش</button>
      </div>
    </div>
  );
}

export default ReplyItem;