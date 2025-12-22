import { useStore } from './useStore';
import { barsAPI, authAPI, passesAPI, partiesAPI } from '../services/api';

// Initialize store with data from API
export async function initializeStore() {
  try {
    // Load bars from API
    const bars = await barsAPI.getAll();
    useStore.setState({ 
      bars,
      featuredBarIds: bars.filter((bar: any) => bar.isFeatured).map((bar: any) => bar.id)
    });

    // Check if user is logged in (has auth token)
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const user = await authAPI.getProfile();
        useStore.setState({ 
          isLoggedIn: true, 
          user 
        });

        // Load user's passes and parties
        const [passes, hostedParties, joinedParties] = await Promise.all([
          passesAPI.getMyPasses(),
          partiesAPI.getMyHosted(),
          partiesAPI.getMyJoined()
        ]);

        useStore.setState({ 
          activePasses: passes,
          parties: [...hostedParties, ...joinedParties]
        });
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem('auth_token');
        useStore.setState({ 
          isLoggedIn: false, 
          user: null,
          activePasses: [],
          parties: []
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
}
