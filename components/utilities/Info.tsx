import { GrInfo } from "react-icons/gr";
import React, { ReactNode } from "react";
type AlertComponentProps = {
  message: ReactNode;
};
const InfoMSg = ({ message }: AlertComponentProps) => {
  return (
    <div role="alert" className="alert alert-info alert-soft mt-2 text-lg p-4">
      <GrInfo className="-mr-2" size={18} />
      {message}
    </div>
  );
};

export default InfoMSg;
