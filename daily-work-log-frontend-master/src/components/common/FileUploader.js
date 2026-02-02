import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Form, Alert } from 'react-bootstrap';

const FileUploader = ({ accept, multiple, onFilesSelected }) => {
  const [files, setFiles] = React.useState([]);
  const [error, setError] = React.useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: accept,
    multiple: multiple,
    onDrop: acceptedFiles => {
      try {
        const newFiles = acceptedFiles.map(file => 
          Object.assign(file, {
            preview: URL.createObjectURL(file)
          })
        );
        
        setFiles(newFiles);
        onFilesSelected(newFiles);
        setError('');
      } catch (err) {
        setError('Error processing files. Please try again.');
        console.error('File upload error:', err);
      }
    }
  });

  const dropzoneStyle = {
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isDragActive ? '#f8f9fa' : 'white'
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div {...getRootProps({ style: dropzoneStyle })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="mb-0">Drop the files here...</p>
        ) : (
          <p className="mb-0">Drag & drop files here, or click to select files</p>
        )}
      </div>
      
      {files.length > 0 && (
        <div className="mt-3">
          <h6>Selected Files:</h6>
          <ul className="list-group">
            {files.map((file, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <span>
                  {file.name} <small className="text-muted">({(file.size / 1024).toFixed(2)} KB)</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
