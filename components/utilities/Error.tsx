import { CircleX } from "lucide-react";
import React, { ReactNode } from "react";
type AlertComponentProps = {
  message: ReactNode;
};
const ErrorMsg = ({ message }: AlertComponentProps) => {
  return (
    <div role="alert" className="alert alert-error alert-soft mt-2 text-lg p-4">
      <CircleX className="-mr-2" size={18} />
      {message}
    </div>
  );
};

export default ErrorMsg;
