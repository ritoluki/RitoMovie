import { useState, useRef, useEffect } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface DropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    label?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const Dropdown = ({
    value,
    onChange,
    options,
    label,
    placeholder,
    className = '',
    disabled = false
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find((option) => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={className} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        !disabled && setIsOpen(!isOpen);
                    }}
                    disabled={disabled}
                    className="relative w-full cursor-pointer rounded-lg bg-gray-800 py-2 pl-3 pr-8 text-center border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    <span className="block truncate text-white">
                        {selectedOption ? (
                            <span className="flex items-center justify-center gap-2">
                                {selectedOption.icon}
                                {selectedOption.label}
                            </span>
                        ) : (
                            <span className="text-gray-400">{placeholder || 'Select an option'}</span>
                        )}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <FiChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1 }}
                            className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 py-1 shadow-xl border border-gray-700 custom-scrollbar text-sm"
                        >
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                        className={`relative w-full cursor-pointer select-none py-2 pl-8 pr-3 text-left transition-colors duration-150 ${isSelected ? 'bg-primary-600/20 text-white font-medium' : 'text-gray-300 hover:bg-primary-600/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            {option.icon}
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-primary-600">
                                                <FiCheck className="h-4 w-4" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Dropdown;
