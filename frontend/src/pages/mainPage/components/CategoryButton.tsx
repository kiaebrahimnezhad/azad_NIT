interface CategoryButtonProps {
  id: string;
  name: string;
  icon: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function CategoryButton({ id, name, icon, isSelected, onSelect }: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`p-4 rounded-xl border-2 text-center transition ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-blue-300 bg-white"
      }`}
    >
      <img src={icon} alt={name} className="w-8 h-8 mx-auto mb-2" />
      <div className="text-sm font-medium">{name}</div>
    </button>
  );
};

export default CategoryButton;