// src/components/Alert.jsx
function Alert({ message }) {
    if (!message) return null;

    return (
        <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            border: '1px solid #ef9a9a',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '14px'
        }}>
            {message}
        </div>
    );
}

export default Alert;