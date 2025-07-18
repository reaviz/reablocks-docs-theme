import { FC, ReactNode } from 'react';

export const ResponsiveContainer: FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={`flex xl:w-auto 2xl:w-full mx-5 md:mx-15 xl:mx-23 2xl:mx-auto max-w-7xl ${className}`}
    >
      {children}
    </div>
  );
};
