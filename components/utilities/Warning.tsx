import { PiWarningFill } from "react-icons/pi";
import React, { ReactNode } from "react";
type AlertComponentProps = {
  message: ReactNode;
};
const WarningMsg = ({ message }: AlertComponentProps) => {
  return (
    <div
      role="alert"
      className="alert alert-warning alert-soft mt-2 text-lg p-4"
    >
      <PiWarningFill className="-mr-2 mt-0.5" size={20} />
      {message}
    </div>
  );
};

export default WarningMsg;
