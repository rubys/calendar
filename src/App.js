import React from 'react';
import './App.css';

function App() {
  function getCalendar(event) {
    event.preventDefault();
    let url = document.getElementById('address').value;

    let options = {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: {"Content-Type": "application/json"}
    }

    fetch('.', options)
      .then(response => response.json())
      .then(console.log);
  }

  return <>
    <div className="container">
    <h1>Calendar</h1>
      <form>
        <div className="form-group">
          <label htmlFor="address">Calendar address</label>
          <input type="url" className="form-control" id="address"
            aria-describedby="addrHelp" placeholder="Enter url" />
          <small id="addrHelp" className="form-text text-muted">Full URL to calendar, typically ends is <code>ics</code>.</small>
        </div>
        <button type="submit" onClick={getCalendar} className="btn btn-primary">Submit</button>
      </form>
    </div>
  </>;
}

export default App;
