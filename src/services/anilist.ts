// services/tmdb.ts
export const tmdb = {
  getTVDetails: async (id: number) => {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=YOUR_KEY`);
    return await res.json();
  },
  getImageUrl: (path: string | null, size: string = 'w500') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : ''
};

// services/anilist.ts
export const anilist = {
  searchAnime: async (query: string, page = 1, perPage = 1) => {
    const queryStr = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(search: $search, type: ANIME) {
            id
            title { romaji english native }
          }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryStr, variables: { search: query, page, perPage } })
    });
    return res.json();
  },

  getAnimeDetails: async (id: number) => {
    const queryStr = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english native }
          description
          bannerImage
          averageScore
          popularity
          episodes
          duration
          status
          format
          source
          genres
          tags { name }
          studios { nodes { name } }
          season
          seasonYear
          relations { edges { relationType node { id title { romaji english } } } }
          recommendations { nodes { mediaRecommendation { id title { romaji english } averageScore } } }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryStr, variables: { id } })
    });
    return res.json();
  }
};
