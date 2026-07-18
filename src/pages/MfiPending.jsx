export function RequireMfi({ children }) {
  const { session, profile, loading } = useAuth();
  const [checked, setChecked] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!session || profile?.role !== "mfi_officer") {
        setChecked(true);
        return;
      }
      const { data: mfi } = await supabase
        .from("mfis")
        .select("status")
        .eq("id", profile.mfi_id)
        .single();
      setApproved(mfi?.status === "approved");
      setChecked(true);
    };
    if (!loading) check();
  }, [loading, session, profile]);

  if (loading || !checked) return <CenteredLoading />;
  if (!session || profile?.role !== "mfi_officer") return <Navigate to="/mfi/login" replace />;
  if (!isOtpVerified(session.user.id)) return <Navigate to="/mfi/login" replace />;
  if (!approved) return <Navigate to="/mfi/pending" replace />;
  return children;
}