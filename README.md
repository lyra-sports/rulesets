# FlowScore Rulesets

[![codecov](https://codecov.io/gh/lyra-sports/rulesets/graph/badge.svg?token=4OQJQODHGR)](https://codecov.io/gh/lyra-sports/rulesets)

FlowScore rulesets provides a vast and open library of calculations for Rope
Skipping competition rules.

These rules are exposed on four different levels from this package:

- **Models**\
  A raw scoring model for a category or type of events, as defined by a specific
  rulebook. It is highly configurable and comes in two flavours:
  - **Competition Event Model**\
    These provide a set of judges with description of their input fields and
    calculations for their judge score. These models also provide functions to
    calculate an entry score, entry ranks, and descriptions of result- and
    preview (shown to the tabulator) tables.
  - **Overall Model**\
    These provide calculations to create ranks across several models, as well
    as descriptions of result tables.
- **Competition Events/Overalls**\
  This is a pre-configured model for a known competition event definition.
  There may be some configuration options still left available that are meant to
  be set on a per-competition level.
- **Rulesets**\
  This provides a filtered list of competition events and overalls relevant to a
  specific rulebook and version.

The scoring pipeline then goes as follows for a competition event:

1. (Configure your competition event model or use a pre-configured model)
2. Calculate every judge's score
3. Take the result of that calculation and calculate every entry's score
4. Take the result of that calculation and calculate the competition event's
   rankings.

For overalls the pipeline is somewhat similar:

1. (Configure your competition event and overall models or use pre-configured
   models)
2. Calculate every judge's score\
   (you can likely use cached results from your competition event pipeline)
3. Take the result of that calculation and calculate every entry's score\
   (also likely cached)
3. **Determine who have competed in all required events.**\
   This library provides utility functions for this step.
4. Take the result of that calculation and calculate each competition event's
   rankings. (This cannot be cached from the other pipeline)
5. Take the result of that ranking and calculate the overall rankings.
