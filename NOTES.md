# TODO:
This does work, but has some issues
- The issue that each location has to have a unique id considering they are opened and closed at different times
- Emulation doesn't work for android but it does work when done on the real thing
- Will need a working way to get the locations data and using the open_ai key to make vector embeddings


# September 4th encountered error, 
NOTE: possibly due to one key being duplicated since it is opened on different times for the days of the week
 ERROR  Warning: Encountered two children with the same key, `.$7`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

  14 |
  15 | export default function Index() {
> 16 |   const [locations, setlocations] = useState<location_data[]>([]);
     |                                             ^
  17 |   const [loading, setLoading] = useState(true);
  18 |
  19 |   async function getlocations() {