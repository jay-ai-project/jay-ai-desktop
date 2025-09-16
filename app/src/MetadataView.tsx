import React from 'react';
import Collapsible from './Collapsible';

interface MetadataViewProps {
  data: Record<string, any>;
}

function MetadataView({ data }: MetadataViewProps) {
  return (
    <div className="metadata-view">
      {Object.entries(data).map(([key, value]) => {
        const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        return (
          <div key={key} className="metadata-item">
            {isObject ? (
              <Collapsible title={key}>
                <MetadataView data={value} />
              </Collapsible>
            ) : (
              <div className="metadata-kv">
                <span className="metadata-key">{key}:</span>
                <span className="metadata-value">{String(value)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MetadataView;
