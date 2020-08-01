import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import './App.css';

import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment)

function App() {
  const [events, setEvents] = useState(null);
  const [disabled, setDisabled] = useState(false);

  function getCalendar(event) {
    event.preventDefault();
    let url = document.getElementById('address').value;

    let options = {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: { "Content-Type": "application/json" }
    }

    setDisabled(true);

    fetch('.', options)
      .then(response => response.json())
      .then(json => {
        setEvents(json.events);
        setDisabled(false);
      });
  }

  if (!events) return <>
    <div className="container">
      <h1>Calendar</h1>
      <form>
        <div className="form-group">
          <label htmlFor="address">Calendar address</label>
          <input type="url" className="form-control" id="address"
            aria-describedby="addrHelp" placeholder="Enter url" />
          <small id="addrHelp" className="form-text text-muted">Full URL to calendar, typically ends in <code>.ics</code>.</small>
        </div>
        <button type="submit" onClick={getCalendar} className="btn btn-primary" disabled={disabled}>Submit</button>
      </form>
    </div>
  </>;

  return <>
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        titleAccessor="summary"
        style={{ height: 500 }}
      />
    </div>
  </>;
}

export default App;
