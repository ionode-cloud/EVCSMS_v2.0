import React from 'react';
import { CheckCircle, Download, Check } from 'lucide-react';
import { RupeeIcon, formatCurrency } from '../data/utils';
import '../App.css';

const PaymentSuccess = ({ setScreen, sessionData, balance }) => {
  const successData = [
    { label: 'Station', value: sessionData.station },
    { label: 'Energy', value: `${(sessionData.energy / 1000).toFixed(3)} kWh` },
    { label: 'Wallet Balance', value: <><RupeeIcon /> {formatCurrency(balance)}</> },
  ];

  return (
    <div className="dialog-box card">
      <h2 className="page-title" style={{ color: 'var(--color-primary-green)' }}>
        <CheckCircle size={24} style={{ marginRight: '8px' }} />
        Payment Successful!
      </h2>

      <div className="data-table">
        {successData.map((item, index) => (
          <div className="table-row" key={index}>
            <span>{item.label}</span>
            <span>{item.value}</span>
          </div>
        ))}

        <div className="table-row table-row-total">
          <span>Amount Paid</span>
          <span><RupeeIcon /> {sessionData.cost.toFixed(2)}</span>
        </div>
      </div>

      <div className="button-group">
        <button onClick={() => setScreen('stations')} className="button-primary">
          Dashboard
        </button>
      </div>

      <div className="toast">
        <Check size={16} /> Payment successful!
      </div>
    </div>
  );
};

export default PaymentSuccess;
