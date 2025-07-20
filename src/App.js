import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [jsonData, setJsonData] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showNestedInputs, setShowNestedInputs] = useState(false);
  const [nestedKey, setNestedKey] = useState('');
  const [nestedValue, setNestedValue] = useState('');
  const [copied, setCopied] = useState(false);

  // Maintain key order using a ref
  const keyOrderRef = useRef([]);
  React.useEffect(() => {
    // Update key order only when a new key is added
    const keys = Object.keys(jsonData);
    keys.forEach(k => {
      if (!keyOrderRef.current.includes(k)) keyOrderRef.current.push(k);
    });
    // Remove deleted keys
    keyOrderRef.current = keyOrderRef.current.filter(k => keys.includes(k));
  }, [jsonData]);

  // Helper to deeply update a value in a nested object
  const updateJson = (obj, path, newKey, newValue, isKeyEdit) => {
    if (path.length === 1) {
      const key = path[0];
      const updated = { ...obj };
      if (isKeyEdit) {
        if (!newKey || newKey === key) return obj; // Don't allow empty or same key
        // Change key name, preserve order
        const value = updated[key];
        const idx = keyOrderRef.current.indexOf(key);
        delete updated[key];
        // Insert new key at the same position
        const entries = Object.entries(updated);
        entries.splice(idx, 0, [newKey, value]);
        keyOrderRef.current[idx] = newKey;
        return Object.fromEntries(entries);
      } else {
        updated[key] = newValue;
      }
      return updated;
    } else {
      const [first, ...rest] = path;
      return {
        ...obj,
        [first]: updateJson(obj[first], rest, newKey, newValue, isKeyEdit)
      };
    }
  };

  // Recursive editable JSON renderer with local state for each input
  const EditableJson = ({ data, path = [] }) => {
    return (
      <div className="editable-json">
        {Object.entries(data).map(([key, value]) => (
          <EditableJsonRow
            key={key}
            objKey={key}
            value={value}
            path={path}
          />
        ))}
      </div>
    );
  };

  // Editable row for a key-value pair
  const EditableJsonRow = ({ objKey, value, path }) => {
    const [localKey, setLocalKey] = useState(objKey);
    const [localValue, setLocalValue] = useState(value);
    React.useEffect(() => {
      setLocalKey(objKey);
    }, [objKey]);
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Commit key change on blur or Enter
    const commitKeyChange = () => {
      if (localKey !== objKey && localKey.trim() && localKey !== '') {
        setJsonData(prev => updateJson(prev, [...path, objKey], localKey, null, true));
      }
    };
    // Commit value change on blur or Enter
    const commitValueChange = () => {
      if (localValue !== value) {
        setJsonData(prev => updateJson(prev, [...path, objKey], null, localValue, false));
      }
    };

    return (
      <div className="editable-json-row">
        <input
          className="edit-key"
          value={localKey}
          onChange={e => setLocalKey(e.target.value)}
          onBlur={commitKeyChange}
          onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
        />
        {typeof value === 'object' && value !== null ? (
          <EditableJson data={value} path={[...path, objKey]} />
        ) : (
          <input
            className="edit-value"
            value={localValue}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={commitValueChange}
            onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } }}
          />
        )}
      </div>
    );
  };

  const addKeyValue = () => {
    if (newKey.trim() && newValue.trim()) {
      setJsonData(prev => {
        const updated = { ...prev, [newKey.trim()]: newValue.trim() };
        // Maintain order
        if (!keyOrderRef.current.includes(newKey.trim())) {
          keyOrderRef.current.push(newKey.trim());
        }
        return updated;
      });
      setNewKey('');
      setNewValue('');
    }
  };

  const showNestedInputSection = () => {
    if (newKey.trim()) {
      setShowNestedInputs(true);
    }
  };

  const addNestedKeyValueToParent = () => {
    if (nestedKey.trim() && nestedValue.trim() && newKey.trim()) {
      setJsonData(prev => {
        const newData = { ...prev };
        if (!newData[newKey]) {
          newData[newKey] = {};
        }
        newData[newKey][nestedKey.trim()] = nestedValue.trim();
        return newData;
      });
      setNestedKey('');
      setNestedValue('');
    }
  };

  const finishNestedObject = () => {
    if (newKey.trim()) {
      setShowNestedInputs(false);
      setNewKey('');
      setNewValue('');
      setNestedKey('');
      setNestedValue('');
    }
  };

  const cancelNestedInput = () => {
    setShowNestedInputs(false);
    setNestedKey('');
    setNestedValue('');
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Render keys in original order
  const orderedEntries = keyOrderRef.current.map(k => [k, jsonData[k]]).filter(([k, v]) => v !== undefined);
  const orderedJson = Object.fromEntries(orderedEntries);

  return (
    <div className="App">
      <div className="container">
        <h1>Simple JSON Builder</h1>
        <div className="input-section">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Enter value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="input-field"
            />
            <button onClick={addKeyValue} className="add-btn">
              Add
            </button>
            <button onClick={showNestedInputSection} className="nested-btn">
              Add Nested
            </button>
          </div>
          {showNestedInputs && (
            <div className="nested-input-section">
              <div className="nested-input-group">
                <input
                  type="text"
                  placeholder="Enter nested key"
                  value={nestedKey}
                  onChange={(e) => setNestedKey(e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Enter nested value"
                  value={nestedValue}
                  onChange={(e) => setNestedValue(e.target.value)}
                  className="input-field"
                />
                <button onClick={addNestedKeyValueToParent} className="add-btn">
                  Add Nested
                </button>
                <button onClick={finishNestedObject} className="finish-btn">
                  Finish
                </button>
                <button onClick={cancelNestedInput} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="content">
          <div className="edit-json-section">
            <h3>Edit JSON</h3>
            <EditableJson data={orderedJson} />
          </div>
          <div className="json-preview">
            <h2>JSON Preview</h2>
            <button onClick={copyJson} className="copy-btn">
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <pre className="json-display">
              {JSON.stringify(orderedJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
