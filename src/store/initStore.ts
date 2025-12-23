import { useStore } from './useStore';
import { authAPI, passesAPI, partiesAPI } from '../services/api';

// Initialize store with data from API
export async function initializeStore() {
  if (initializeStore._didInit) return;
  initializeStore._didInit = true;

  try {
    // Always refresh public data (bars + open parties) on every load
    await useStore.getState().refreshPublicData?.();

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

    // Always refresh public data (bars + open parties) so all devices stay in sync
    await useStore.getState().refreshPublicData?.();
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
}

// track whether we've already run init in this session
initializeStore._didInit = false as boolean;
