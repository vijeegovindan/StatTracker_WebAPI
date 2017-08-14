# StatTracker_WebAPI

API Specification  

For your API, we have specified the endpoints you'll need and what they should do. The URLs we using are not prefixed: yours should have /api/ in front of them.

All the endpoints require authentication. You can use JSON Web Tokens for authentication, or if you prefer, you can use HTTP Basic Authentication. Feel free to use Passport to make this part easier.

Verb	URL	Action
GET	/activities	Show a list of all activities I am tracking, and links to their individual pages
POST	/activities	Create a new activity for me to track.
GET	/activities/{id}	Show information about one activity I am tracking, and give me the data I have recorded for that activity.
PUT	/activities/{id}	Update one activity I am tracking, changing attributes such as name or type. Does not allow for changing tracked data.
DELETE	/activities/{id}	Delete one activity I am tracking. This should remove tracked data for that activity as well.
POST	/activities/{id}/stats	Add tracked data for a day. The data sent with this should include the day tracked. You can also override the data for a day already recorded.
DELETE	/stats/{id}	Remove tracked data for a day.
