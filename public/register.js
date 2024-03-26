async function registerUser(username, password) {
    try {
      const response = await fetch('/api/register', {
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
          console.log('User registered successfully');
          window.location.href = '/login.html';
        } else {
          console.error('Error registering user:', data.error);
        }
      } else {
        console.error('Error registering user');
      }
    } catch (error) {
      console.error('Error registering user:', error);
    }
  }