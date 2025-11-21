import React from "react";
import "../App.css";

const PaymentDue = ({ setScreen, sessionData, setBalance, history, setHistory }) => {
  const handlePayNow = async () => {
    try {
      if (!sessionData?.cost || isNaN(sessionData.cost) || sessionData.cost <= 0) {
        alert("Invalid amount for payment!");
        return;
      }

      // Create Razorpay order
      const response = await fetch("http://localhost:38923/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(sessionData.cost) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create order");

      const options = {
        key: "rzp_test_R8hZFBr7vJp0td",
        amount: data.amount,
        currency: data.currency,
        name: "EV Charging Station",
        description: "Charging Session Payment",
        order_id: data.orderId,
        handler: async (res) => {
          const verifyRes = await fetch("http://localhost:38923/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            const newHistoryItem = {
              id: Date.now(),
              station: sessionData.station,
              timestamp: sessionData.timestamp,
              energy: sessionData.energy,
              cost: sessionData.cost,
            };
            setHistory([newHistoryItem, ...history]);
            setBalance(prev => prev - sessionData.cost);
            setScreen("payment_success");
          } else {
            alert(" Payment verification failed!");
          }
        },
        prefill: { name: "EV User", email: "user@example.com", contact: "9999999999" },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(" Payment error:", err);
      alert("Payment failed! Please try again.");
    }
  };

  return (
    <div className="dialog-box card">
      <h2 className="page-title">Payment Due</h2>
      <p>Review your charging session</p>

      <div className="data-table">
        <div className="table-row"><span>Station</span><span>{sessionData.station}</span></div>
        <div className="table-row"><span>Power Consumed</span><span>{(sessionData.energy / 1000).toFixed(3)} kWh</span></div>
        <div className="table-row"><span>Rate</span><span>₹ 5 / kWh</span></div>
        <div className="table-row table-row-total"><span>Total Payable</span><span>₹ {Number(sessionData.cost).toFixed(2)}</span></div>
      </div>

      <div className="button-group">
        <button onClick={handlePayNow} className="button-primary">Pay Now</button>
        {/* <button onClick={() => setScreen("history")} className="button-primary">View History</button> */}
      </div>
    </div>
  );
};

export default PaymentDue;
