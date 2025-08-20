import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NewGamePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to game page immediately
    // Using replace to avoid adding to history stack
    navigate('/game', { replace: true });
  }, [navigate]);

  // Show nothing while redirecting
  return null;
};

export default NewGamePage;
