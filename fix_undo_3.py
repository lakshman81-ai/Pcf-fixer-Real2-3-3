import re

with open('src/store/useStore.js', 'r') as f:
    content = f.read()

# I see what went wrong. The `useStore.js` file might already have an `undo` or it doesn't have `setTranslucentMode`.
# Let's check `useStore.js`
if 'setTranslucentMode' in content:
    print('setTranslucentMode found')
else:
    print('setTranslucentMode NOT found')
