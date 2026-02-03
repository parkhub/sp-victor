import React, { useState } from "react";

interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface SelectCardProps {
  data: {
    question: string;
    options: SelectOption[];
    context?: string;
  };
  onSelect: (selectedValue: string) => void;
}

export function SelectCard({ data, onSelect }: SelectCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionClick = async (index: number) => {
    if (isSubmitting) return;

    setSelectedIndex(index);
    setIsSubmitting(true);

    try {
      await onSelect(data.options[index].value);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dialog-container">
      {data.context && (
        <div className="dialog-context">
          {data.context}
        </div>
      )}

      <div className="dialog-choices">
        {data.options.map((option, index) => (
          <button
            key={option.value}
            onClick={() => handleOptionClick(index)}
            disabled={isSubmitting}
            className={`dialog-choice ${
              selectedIndex === index && isSubmitting ? "selected" : ""
            }`}
          >
            <span className="choice-bracket">[</span>
            <span className="choice-content">
              <span className="choice-label">{option.label}</span>
              {option.description && (
                <span className="choice-description"> - {option.description}</span>
              )}
            </span>
            <span className="choice-bracket">]</span>
          </button>
        ))}
      </div>
    </div>
  );
}
