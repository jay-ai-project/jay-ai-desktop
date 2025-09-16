import React, { useState, PropsWithChildren } from 'react';

interface CollapsibleProps {
  title: string;
}

function Collapsible({ title, children }: PropsWithChildren<CollapsibleProps>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="collapsible">
      <button className="collapsible-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▶</span> {title}
      </button>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
}

export default Collapsible;
