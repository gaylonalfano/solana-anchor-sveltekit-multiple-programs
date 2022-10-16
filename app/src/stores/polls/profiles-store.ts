import { writable, type Writable } from 'svelte/store';
import type anchor from '@project-serum/anchor';
import type { ProfileObject } from '../../models/polls-types';
import type { ProfileStore } from './profile-store'


function createProfilesStore() {
  const { subscribe, set, update } = writable<ProfileStore[]>([]);
  
  return {
    subscribe,
    set,
    update,
    addProfile: async (profile: ProfileObject, pda: anchor.web3.PublicKey) => {
      // Won't have the PDA but can still add IDL ["Profile"] object
      update((profilesStore: ProfileStore[]) => {
        return [
          ...profilesStore,
          {
            profile,
            pda
          }
        ] 
      });
    },
    addProfileStore: async (profileStore: ProfileStore) => {
      update((profilesStore: ProfileStore[]) => {
        return [...profilesStore, profileStore]
      });
    },
    deleteProfile: (pda: anchor.web3.PublicKey) => {
      update((profilesStore: ProfileStore[]) => {
        return profilesStore.filter((profileStore: ProfileStore) => profileStore.pda !== pda);
      })
    },
    reset: () => set([])
  }
}

export const profilesStore = createProfilesStore();
