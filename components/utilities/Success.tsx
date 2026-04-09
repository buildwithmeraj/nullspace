import { CircleCheckBig } from "lucide-react";
import React, { ReactNode } from "react";
type AlertComponentProps = {
  message: ReactNode;
};

const SuccessMsg = ({ message }: AlertComponentProps) => {
  return (
    <div
      role="alert"
      className="alert alert-success alert-soft text-sm p-3 rounded-xl"
    >
      <CircleCheckBig size={18} />
      {message}
    </div>
  );
};

export default SuccessMsg;
