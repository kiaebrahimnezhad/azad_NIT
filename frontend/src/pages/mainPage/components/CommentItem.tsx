interface CommentItemProps {
  sender: string;
  text: string;
  /** آیا این آیتم یک پاسخ (زیرمجموعه‌ی یک کامنت ریشه) است یا خود یک کامنت ریشه */
  isReply?: boolean;
  onReply: () => void;
  onReport: () => void;
}

function CommentItem({ sender, text, isReply = false, onReply, onReport }: CommentItemProps) {
  const containerClass = isReply
    ? "relative ml-6 mt-4 border-l-4 border-blue-200 pl-4 bg-blue-50 rounded-lg flex justify-between items-start"
    : "relative rounded-lg bg-gray-50 border border-gray-200 p-4 shadow-sm flex justify-between items-start";
  const senderClass = isReply ? "font-semibold text-blue-600" : "font-semibold text-blue-700";
  const textClass = isReply ? "text-gray-700 whitespace-pre-line" : "text-gray-800 whitespace-pre-line";
  const actionsClass = isReply ? "flex flex-col items-end space-y-1 text-xs" : "flex flex-col items-end space-y-2";
  const buttonSizeClass = isReply ? "" : "text-sm ";

  return (
    <div className={containerClass}>
      <div>
        <p className={senderClass}>{sender}</p>
        <p className={textClass}>{text}</p>
      </div>
      <div className={actionsClass}>
        <button className={`${buttonSizeClass}text-blue-600 hover:underline`} onClick={onReply}>پاسخ</button>
        <button className={`${buttonSizeClass}text-red-500 hover:underline`} onClick={onReport}>گزارش</button>
      </div>
    </div>
  );
}

export default CommentItem;
