def chunked(seq, size):
    """Split a sequence into lists of at most `size` items."""
    return [seq[i : i + size] for i in range(0, len(seq), size)]
