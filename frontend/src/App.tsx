import { useState } from 'react';
import Select from 'react-select';
import axios from 'axios';
import Papa from 'papaparse';

interface GeneratedNumber {
  number: string;
}

interface ValidatedNumber {
  number: string;
  valid: boolean;
  carrier: string;
  line_type: string;
  location: string;
}

interface OptionType {
  value: string;
  label: string;
}

const statesList: OptionType[] = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", 
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", 
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", 
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
  "West Virginia", "Wisconsin", "Wyoming"
].map(state => ({ value: state, label: state }));

function App() {
  const [selectedStates, setSelectedStates] = useState<OptionType[]>([]);
  const [numbers, setNumbers] = useState<GeneratedNumber[]>([]);
  const [validated, setValidated] = useState<ValidatedNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState("");

  const generateNumbers = async () => {
    setLoading(true);
    setMessage("");
    setNumbers([]);
    setValidated([]);

    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        states: selectedStates.map(s => s.value),
        count: 1000
      });

      const formatted = response.data.numbers.map((item: any) => ({
        number: `+1 ${item.number}`
      }));

      setNumbers(formatted);
      setMessage(`✅ Generated 1,000 numbers`);
    } catch {
      setMessage("❌ Error generating numbers");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        states: selectedStates.map(s => s.value),
        count: 1000
      });

      const formatted = response.data.numbers.map((item: any) => ({
        number: `+1 ${item.number}`
      }));

      setNumbers(prev => [...prev, ...formatted]);
      setMessage(`✅ Added 1,000 more (Total: ${numbers.length + 1000})`);
    } catch {
      setMessage("❌ Error loading more");
    } finally {
      setLoadingMore(false);
    }
  };

  // 🔹 KEPT but not used in UI
  const validateWithNumverify = async () => {
    if (numbers.length === 0) return alert("Generate numbers first!");

    setValidating(true);
    setMessage("Validating first 20 numbers with Numverify...");

    try {
      const response = await axios.post('http://localhost:5000/api/validate', {
        numbers: numbers.map(n => n.number)
      });

      setValidated(response.data.results);
      setMessage(response.data.note || "Validation completed");
    } catch {
      setMessage("❌ Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const exportableNumbers = validated.filter(item => 
    item.valid && item.line_type?.toLowerCase() !== 'landline'
  );

  const exportAllGenerated = () => {
    if (numbers.length === 0) {
      return alert("No numbers to export.");
    }

    const cleanData = numbers.map(item => ({
      number: item.number
    }));

    const csv = Papa.unparse(cleanData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `all_generated_numbers_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const exportNonLandline = () => {
    if (exportableNumbers.length === 0) {
      return alert("No valid non-landline numbers yet.");
    }

    const cleanData = exportableNumbers.map(item => ({
      number: item.number
    }));

    const csv = Papa.unparse(cleanData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `valid_non_landline_numbers_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const copyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    const toast = document.createElement('div');
    toast.textContent = `Copied: ${number}`;
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:10000;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>USA Phone Number Generator</h2>

      <div style={{ margin: '25px 0' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Select States (Hold Ctrl/Cmd to select multiple) or empty for All States:
        </label>
        <Select
          options={statesList}
          isMulti
          value={selectedStates}
          onChange={(newValue) => setSelectedStates(newValue as OptionType[])}
          placeholder="Select one or more states..."
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={generateNumbers}
          disabled={loading}
          style={{ padding: '14px 32px', fontSize: '17px', background: loading ? '#666' : '#007bff', color: 'white', border: 'none', borderRadius: '8px', marginRight: '12px' }}
        >
          {loading ? 'Generating 1,000...' : 'Generate 1,000 Numbers'}
        </button>
      </div>

      {message && <p style={{ fontWeight: 'bold', color: message.includes('❌') ? 'red' : 'green' }}>{message}</p>}

      {numbers.length > 0 && (
        <div>
          <h3>Generated Numbers ({numbers.length})</h3>

          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={exportAllGenerated}
              style={{ 
                padding: '12px 24px', 
                fontSize: '16px', 
                background: '#6f42c1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px'
              }}
            >
              📥 Export All Generated ({numbers.length})
            </button>
          </div>

          <div style={{ maxHeight: '520px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '10px', background: '#fff' }}>
            {numbers.map((item, index) => (
              <div 
                key={index}
                onClick={() => copyNumber(item.number)}
                style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontFamily: 'monospace', fontSize: '18px', cursor: 'pointer' }}
              >
                {item.number}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={loadMore} disabled={loadingMore}
              style={{ padding: '12px 28px', fontSize: '16px', background: loadingMore ? '#666' : '#6c757d', color: 'white', border: 'none', borderRadius: '8px' }}>
              {loadingMore ? 'Adding...' : 'Load More (+1,000)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;