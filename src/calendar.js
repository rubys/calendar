import icaljs from 'ical.js';
import icalgen from 'ical-generator';

// convert ical to jcal
export function parse(ical) {
  return icaljs.parse(ical.toString());
}

// reduce jcal to calendar and event objects
export function reduce(jcal) {
  let calendar = {};
  let events = [];

  let vcalendar = jcal[1];
  for (let attr of vcalendar) {
    if (attr[0] === 'name') calendar.name = attr[3];
  };

  for (let vevent of jcal[2]) {
    if (vevent[0] !== 'vevent') continue;

    let event = {}
    for (let attr of vevent[1]) {
      let attrName = nameMap[attr[0]] || attr[0];
    

      if (attrName === 'organizer') {
        event.organizer = person(attr);
      } else if (attrName === 'attendee') {
        if (!event.attendees) event.attendees = [];
        event.attendees.push(person(attr));
      } else if (attrName === 'start') {
        event.start = attr[3];

        if (attr[1].tzid) {
          event.timezone = attr[1].tzid;
        }
      } else if (attrName === 'x-alt-desc' && attr[1].fmttype === 'text/html') {
        event.htmlDescription = attr[3];
      } else if (attrName === 'geo' && attr[3].length === 2) {
        event.geo = { lat: attr[3][0], lon: attr[3][1] };
      } else if (attrName === 'categories') {
        event.categories = attr.slice(3).map(name => ({ name }));
      } else if (['transparency', 'status', 'busystatus'].includes(attrName)) {
        event[attrName] = attr[3].toLowerCase();
      } else if (['allDay', 'x-microsoft-msncalendar-alldayevent'].includes(attrName)) {
        event.allDay = (attr[3] === 'TRUE');
      } else if (attrName === 'repeating') {
        event.repeating = {
          ...(event.repeating || {}),
          ...Object.fromEntries(Object.entries(attr[3]).map(
            ([name, value]) => [nameMap[name] || name, value]
          ))
        }
      } else if (attrName === 'exclude') {
        if (!event.repeating) event.repeating = {};
        if (!event.repeating.exclude) event.repeating.exclude = [];
        event.repeating.exclude.push(attr[3]);
        if (attr[1].tzid) event.repeating.excludeTimezone = attr[1].tzid;
      } else if (attrName === 'appleLocation' && attr[3].startsWith('geo:')) {
        let [lat, lon] = attr[3].split(':')[1].split(',');
        event[attrName] = {geo: { lat, lon }};
        for (let [name, value] of Object.entries(attr[1])) {
          event[attrName][name.split('-').pop()] = value;
        }
      } else {
        event[attrName] = attr[3];
      }
    }

    for (let valarm of vevent[2]) {
      let alarm = {};
      for (let attr of valarm[1]) {
        let attrName = attr[0];
        if (attrName === 'trigger') {
          alarm.trigger = -duration(attr[3]);
        } else if (attrName === 'duration') {
          alarm.interval = duration(attr[3]);
        } else if (attrName === 'action') {
          alarm.type = attr[3].toLowerCase();
        } else if (attrName === 'description' && attr[3] === event.summary) {
          // ignore
        } else {
          alarm[attrName] = attr[3];
        }
      }

      if (!event.alarms) event.alarms = [];
      event.alarms.push(alarm);
    }

    events.push(event);
  }

  return { calendar, events };
}

// mapping from jcal names to event names
const nameMap = {
  cn: 'name',
  cutype: 'type',
  partstat: 'status',
  dtend: 'end',
  dtstamp: 'stamp',
  dtstart: 'start',
  'last-modified': 'lastModified',
  transp: 'transparency',
  byday: 'byDay',
  bymonth: 'byMonth',
  bymonthday: 'byMonthDay',
  bysetpos: 'bySetPos',
  exdate: 'exclude',
  rrule: 'repeating',
  'delegated-to': 'delegatesTo',
  'delegated-from': 'delegateseFrom',
  'recurrence-id': 'recurrenceId',
  'x-apple-structured-location': 'appleLocation',
  'x-microsoft-cdo-busystatus': 'busystatus',
  'x-microsoft-cdo-alldayevent': 'allDay'
}

// parse a person (organizer, attendee)
function person(attr) {
  let person = Object.fromEntries(Object.entries(attr[1]).map(
    ([name, value]) => {
      name = nameMap[name] || name;
      if (name === 'rsvp') value = (value === 'TRUE');
      if (['status', 'type'].includes(name)) value = value.toLowerCase();
      return [name, value];
    }
  ));

  person.email = attr[3].replace(/^mailto:/i, '');

  if (Object.keys(person.length === 3) && person.name && person.role === 'REQ-PARTICIPANT') {
    delete person.role;
  }

  if (Object.keys(person).length === 2 && person.name) {
    person = `${person.name} <${person.email}>`;
  }

  return person;
}

// parse a duration into seconds
function duration(trigger) {
  let duration = 0;

  for (let part of trigger.matchAll(/(\d+)([SMHDW])(\d+$)?/g)) {
    if (part[2] === 'S') {
      duration += parseInt(part[1]);
    } else if (part[2] === 'M') {
      duration += parseInt(part[1]) * 60;
      if (part[3]) duration += parseInt(part[3]);
    } else if (part[2] === 'H') {
      duration += parseInt(part[1]) * 3600;
      if (part[3]) duration += parseInt(part[3]) * 60;
    } else if (part[2] === 'D') {
      duration += parseInt(part[1]) * 86400;
    } else if (part[2] === 'W') {
      duration += parseInt(part[1]) * 86400 * 7;
    }
  };

  if (trigger.includes('-')) duration = -duration;

  return duration;
}

// serialize calendar and events to ical format
// strips off "@undefined" that ical-generator adds to uids if
// calendar domain is not specified
export function serialize({ calendar, events } = { calendar: {}, events: [] }) {
  let cal = icalgen(calendar);

  for (let event of events) {
    let vevent = cal.createEvent(event);

    for (let attr in event) {
      if (attr.startsWith('x-')) {
        vevent.x(attr.toUpperCase(), event[attr]);
      }
    }
  }

  return cal.toString().replace(/^(UID:.*)@undefined/m, (match, uid) => uid);
}