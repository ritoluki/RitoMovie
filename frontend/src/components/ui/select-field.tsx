import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import Dropdown from '@/components/common/Dropdown';

// Migration adapter for existing admin filter option markup, without synthetic DOM events.
const text = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? text(child.props.children)
          : ''
    )
    .join('');
const optionsFrom = (children: ReactNode): { value: string; label: string }[] =>
  Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{ value?: string | number; children?: ReactNode }>(child)
    )
      return [];
    if (child.type === Fragment) return optionsFrom(child.props.children);
    return [
      {
        value: String(child.props.value ?? text(child.props.children)),
        label: text(child.props.children),
      },
    ];
  });
export const SelectField = ({
  children,
  value,
  onValueChange,
  className,
  disabled,
}: {
  children: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) => {
  const options = optionsFrom(children);
  return (
    <Dropdown
      value={value}
      onChange={onValueChange}
      options={options}
      placeholder={options[0]?.label}
      className={className}
      disabled={disabled}
    />
  );
};
