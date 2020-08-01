import React from 'react';
import './App.css';

function App() {
  return <>
    <div className="container">
    <h1>Calendar</h1>
      <form method="post">
        <div className="form-group">
          <label htmlFor="address">Calendar address</label>
          <input type="url" className="form-control" id="address"
            aria-describedby="addrHelp" placeholder="Enter url" />
          <small id="addrHelp" className="form-text text-muted">Full URL to calendar, typically ends is <code>ics</code>.</small>
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    </div>
  </>;
}

export default App;
