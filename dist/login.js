async function loginUser(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Include cookies in the request
      });
  
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('User logged in successfully');
          window.location.href = '/index.html';
        } else {
          console.error('Error logging in:', data.error);
        }
      } else {
        console.error('Error logging in');
      }
    } catch (error) {
      console.error('Error logging in:', error);
    }
  }