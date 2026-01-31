# User Presence Backend Implementation Guide

This document outlines the backend changes required to support user presence functionality using Laravel Reverb.

## Overview

The frontend implements user presence tracking for:
1. **Space-level presence** - Users currently viewing a space
2. **Content-level presence** - Users currently editing/viewing specific content items

## Required Backend Changes

### 1. Authentication for Private/Presence Channels

Ensure your `routes/channels.php` properly authenticates presence channels:

```php
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('presence-spaces.{spaceId}', function ($user, $spaceId) {
    $space = Space::find($spaceId);
    
    // Verify user has access to this space
    if (!$space || !$space->hasAccess($user)) {
        return false;
    }
    
    // Return user data that will be shared with other users
    return [
        'id' => $user->id,
        'firstname' => $user->firstname,
        'lastname' => $user->lastname,
        'email' => $user->email,
        'avatar' => $user->avatar,
        'joined_at' => now()->toIso8601String(),
    ];
});

Broadcast::channel('presence-spaces.{spaceId}.content', function ($user, $spaceId) {
    $space = Space::find($spaceId);
    
    if (!$space || !$space->hasAccess($user)) {
        return false;
    }
    
    return [
        'id' => $user->id,
        'firstname' => $user->firstname,
        'lastname' => $user->lastname,
        'email' => $user->email,
        'avatar' => $user->avatar,
        'joined_at' => now()->toIso8601String(),
        'content_id' => null, // Will be set when user navigates to specific content
    ];
});

Broadcast::channel('presence-spaces.{spaceId}.content.{contentId}', function ($user, $spaceId, $contentId) {
    $space = Space::find($spaceId);
    $content = Content::find($contentId);
    
    if (!$space || !$content || !$space->hasAccess($user)) {
        return false;
    }
    
    return [
        'id' => $user->id,
        'firstname' => $user->firstname,
        'lastname' => $user->lastname,
        'email' => $user->email,
        'avatar' => $user->avatar,
        'joined_at' => now()->toIso8601String(),
    ];
});
```

### 2. Content Presence Tracking Events

Create events to broadcast when users navigate between content items:

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentPresenceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $spaceId,
        public string $contentId,
        public array $user,
        public string $action // 'join' or 'leave'
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('spaces.' . $this->spaceId . '.content'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'content:presence';
    }
}
```

### 3. API Endpoints for Presence

#### 3.1 Peek Space Presence (Read-Only)

For the space overview page, provide a read-only endpoint to see who's online without joining the presence channel:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Space;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class PresenceController extends Controller
{
    /**
     * Get current presence data for a space without joining
     * Used by space overview to show online users
     */
    public function getSpacePresence(Request $request, Space $space)
    {
        $this->authorize('view', $space);
        
        // Get presence data from Redis/Reverb
        // The exact implementation depends on your broadcasting driver
        $channelName = 'presence-spaces.' . $space->id;
        $presenceData = $this->getChannelPresence($channelName);
        
        return response()->json([
            'space_id' => $space->id,
            'users' => $presenceData['users'] ?? [],
            'count' => $presenceData['count'] ?? 0,
        ]);
    }
    
    /**
     * Get presence data from the broadcasting driver
     * This is driver-specific (Pusher, Reverb, etc.)
     */
    private function getChannelPresence(string $channelName): array
    {
        // For Reverb with Redis:
        $redisKey = "reverb:presence:{$channelName}";
        $data = Redis::get($redisKey);
        
        if ($data) {
            $presence = json_decode($data, true);
            return [
                'users' => array_values($presence['users'] ?? []),
                'count' => count($presence['users'] ?? []),
            ];
        }
        
        // Alternative: Query your own presence tracking table
        // return $this->getPresenceFromDatabase($channelName);
        
        return ['users' => [], 'count' => 0];
    }
}
```

#### 3.2 Update Presence Location

Create endpoints to track when users navigate to different content:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Events\ContentPresenceUpdated;
use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\Space;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    /**
     * Update user's current content location
     */
    public function updateContentPresence(
        Request $request, 
        Space $space, 
        ?Content $content = null
    ) {
        $this->authorize('view', $space);
        
        if ($content) {
            $this->authorize('view', $content);
        }
        
        $user = $request->user();
        $previousContentId = $request->input('previous_content_id');
        
        // Broadcast leave event for previous content
        if ($previousContentId) {
            broadcast(new ContentPresenceUpdated(
                $space->id,
                $previousContentId,
                [
                    'id' => $user->id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ],
                'leave'
            ))->toOthers();
        }
        
        // Broadcast join event for new content
        if ($content) {
            broadcast(new ContentPresenceUpdated(
                $space->id,
                $content->id,
                [
                    'id' => $user->id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ],
                'join'
            ))->toOthers();
        }
        
        return response()->json(['status' => 'success']);
    }
}
```

### 4. Routes

Add the presence routes:

```php
<?php

use App\Http\Controllers\Api\PresenceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // Read-only presence peek (for space overview)
    Route::get('/spaces/{space}/presence', [PresenceController::class, 'getSpacePresence']);
    
    // Presence update endpoints
    Route::post('/spaces/{space}/presence', [PresenceController::class, 'updateSpacePresence']);
    Route::post('/spaces/{space}/content/{content}/presence', [PresenceController::class, 'updateContentPresence']);
    Route::delete('/spaces/{space}/presence', [PresenceController::class, 'leaveSpacePresence']);
    Route::delete('/spaces/{space}/content/{content}/presence', [PresenceController::class, 'leaveContentPresence']);
});
```

### Authentication Headers

The frontend uses a custom authorizer that sends the following headers with every auth request:
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <jwt_token>`
- `X-Requested-With: XMLHttpRequest`

The request body contains:
- `socket_id`: The Pusher socket ID
- `channel_name`: The channel being subscribed to

### Example Auth Response

Your `/broadcasting/auth` endpoint should return:

```json
{
  "auth": "<app_key>:<signature>",
  "channel_data": "{\"user_id\":\"123\",\"user_info\":{...}}"
}
```

## Architecture Overview

### Peeking vs Joining

The frontend uses two different approaches for presence:

1. **Peeking (Space Overview)** - Uses API endpoint to read presence data without joining the WebSocket channel
   - User does NOT appear as "online" in the space
   - Can see who else is online
   - Used on the spaces list/overview page

2. **Joining (Inside Space/Content)** - Uses WebSocket presence channels
   - User DOES appear as "online" to others
   - Real-time updates when users join/leave
   - Used when actually viewing/editing content

### Data Flow

```
Space Overview Page:
  ↓ HTTP GET /spaces/{id}/presence
  ↓ Returns current users (snapshot)
  ↓ User NOT added to presence list

Inside Space:
  ↓ WebSocket: Join presence-spaces.{id}
  ↓ Real-time updates via WebSocket
  ↓ User IS added to presence list

Editing Content:
  ↓ WebSocket: Join presence-spaces.{id}.content.{contentId}
  ↓ Real-time updates via WebSocket
  ↓ User IS added to content presence list
```

## Security Considerations

1. **Authorization**: Always verify the user has access to the space/content before allowing them to join presence channels
2. **Data Exposure**: Only expose necessary user data in presence channels (id, name, avatar)
3. **Rate Limiting**: Consider rate limiting presence update endpoints to prevent abuse
4. **Cleanup**: Implement periodic cleanup of stale presence data

## Performance Considerations

1. **Redis**: Use Redis as the broadcasting driver for better performance with presence channels
2. **Connection Limits**: Monitor connection limits on your Reverb server
3. **Event Payload**: Keep event payloads minimal to reduce bandwidth usage

## Testing

Test the presence functionality:

1. Open the same space in two different browsers/sessions
2. Verify both users appear in each other's presence lists
3. Navigate to content items and verify presence updates
4. Close a browser and verify the user is removed from presence lists

## Frontend Integration

The frontend expects the following data structure from presence channels:

```typescript
interface PresenceUser {
  id: string
  firstname: string
  lastname: string
  email: string
  avatar?: string
  joined_at: string
  content_id?: string // For content-level presence
}
```

Events should be broadcast with the following structure:

```typescript
// content:presence event
{
  content_id: string
  user: PresenceUser
  action: 'join' | 'leave'
}
```
